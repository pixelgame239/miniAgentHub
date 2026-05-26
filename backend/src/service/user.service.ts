import { prisma } from "../../lib/prisma";

export class UserService{
    public async getAllUsers(){
        const response = await prisma.user.findMany({select:{
            id:true,
            fullname:true,
            email:true,
            userRole:true,
            groups: {
                select:{
                    id: true,
                    groupName: true
                }
            },
            active:true
        }});
        return response;
    }
    public async updateUser(userId: number, formData: any){
        const response = await prisma.user.update({where:{
            id: userId
        }, data:{
            fullname: formData.fullname,
            userRole: formData.userRole,
            groups:{
                set: formData.groups.map((id:number)=>({id:id}))
            }
        }, include:{
            groups:true
        }})
    }
    public async deleteUser(userId:number){
        const response = await prisma.user.delete({where:{id: userId}});
        return response;
    }
}